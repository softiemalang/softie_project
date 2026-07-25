import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { prepareInterpretationData, buildExportPayload, exportPayloadToMarkdown } from '../src/interpretationPrep/prepare.js'

test('DST ambiguous local time boundary test (1987-10-11 DST end overlap)', () => {
  // 1. 02:00 -> 2 timezone candidates (DST overlap start)
  const res0200 = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:00', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })
  assert.equal(res0200.raw.calculationUncertainty.historicalTimezone.candidates.length, 2)
  assert.equal(res0200.stateContract.verificationStatus, 'candidate_required')

  // 2. 02:30 -> 2 timezone candidates (DST overlap middle)
  const res0230 = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })
  assert.equal(res0230.raw.calculationUncertainty.historicalTimezone.candidates.length, 2)
  assert.equal(res0230.stateContract.verificationStatus, 'candidate_required')

  // 3. 02:59 -> 2 timezone candidates (DST overlap end)
  const res0259 = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:59', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })
  assert.equal(res0259.raw.calculationUncertainty.historicalTimezone.candidates.length, 2)
  assert.equal(res0259.stateContract.verificationStatus, 'candidate_required')

  // 4. 03:00 -> 1 candidate (Standard KST after DST end)
  const res0300 = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '03:00', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })
  assert.equal(res0300.raw.candidates.length, 1)

  // 5. 1988-10-09 02:30 -> 2 timezone candidates (1988 DST overlap)
  const res1988 = calculateSajuSystem({ birthDate: '1988-10-09', birthTime: '02:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'female', timeAccuracy: 'exact' })
  assert.equal(res1988.raw.calculationUncertainty.historicalTimezone.candidates.length, 2)
})

test('DST candidates preserve explicit UTC datetimes, input assumptions, and distinct derived outcomes', () => {
  const result = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })

  const candidates = result.raw.calculationUncertainty.historicalTimezone.candidates
  assert.equal(candidates.length, 2)

  const candidateA = candidates.find((c) => c.label && c.label.includes('표준시'))
  const candidateB = candidates.find((c) => c.label && c.label.includes('서머타임'))

  assert.ok(candidateA)
  assert.ok(candidateB)

  // Check pillars existence
  assert.ok(candidateA.pillars)
  assert.ok(candidateB.pillars)
})

test('DST overlap aligns with top-level candidate_required and candidate_only state contract', () => {
  const result = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })

  assert.equal(result.stateContract.inputStatus, 'valid')
  assert.equal(result.stateContract.calculationStatus, 'calculated')
  assert.equal(result.stateContract.verificationStatus, 'candidate_required')
  assert.equal(result.stateContract.interpretationStatus, 'candidate_only')
  assert.equal(result.stateContract.confidence, 'low')
})

test('DST candidates comparison diff generates structured diff object', () => {
  const result = calculateSajuSystem({ birthDate: '1987-10-11', birthTime: '02:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })

  const comparison = result.raw.candidateComparison
  assert.ok(comparison)
  assert.ok(Array.isArray(comparison.equivalentFields))
  assert.ok(Array.isArray(comparison.differences))
  assert.ok(['different', 'equivalent_pillars', 'identical'].includes(comparison.status))
})

test('Standard input regression test (normal non-DST input)', () => {
  const result = calculateSajuSystem({ birthDate: '1995-05-15', birthTime: '14:30', calendar: 'solar', timezone: 'Asia/Seoul', gender: 'male', timeAccuracy: 'exact' })

  assert.equal(result.raw.candidates.length, 1)
  assert.equal(result.stateContract.verificationStatus, 'verified')
  assert.equal(result.stateContract.interpretationStatus, 'experimental')
  assert.equal(result.stateContract.confidence, 'high')
})

test('Prepare package export includes DST candidates and markdown rendering', () => {
  const prep = prepareInterpretationData({
    birthDate: '1987-10-11',
    birthTime: '02:30',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    targetDate: '2026-07-25',
    referenceCity: 'seoul',
    placeName: '서울',
    question: '종합운',
  })

  assert.equal(prep.systems.saju.stateContract.verificationStatus, 'candidate_required')
  assert.equal(prep.systems.saju.stateContract.interpretationStatus, 'candidate_only')
})

test('Normal input pillars and daYun stability regression test', () => {
  const result = calculateSajuSystem({
    birthDate: '1987-10-11',
    birthTime: '03:00',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
  })

  assert.equal(result.raw.pillars.year.value, '정묘')
  assert.equal(result.raw.pillars.month.value, '경술')
  assert.equal(result.raw.pillars.day.value, '계사')
  assert.equal(result.raw.pillars.hour.value, '계축')
  assert.ok(result.raw.timing.daYun.cycles.length > 0)
  assert.equal(result.raw.timing.daYun.direction, 'backward')
})

test('DST candidate source input explicitly includes targetDate, timezone, and supports missing targetDate', () => {
  const result = calculateSajuSystem({
    birthDate: '1987-10-11',
    birthTime: '02:30',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
  })

  const tzCandidates = result.raw.calculationUncertainty.historicalTimezone.candidates
  assert.equal(tzCandidates.length, 2)
  assert.equal(result.raw.candidates[0].input.targetDate, '2026-07-25')
  assert.equal(result.raw.candidates[0].input.timezone, 'Asia/Seoul')

  // targetDate가 없는 경우 테스트
  const noTargetResult = calculateSajuSystem({
    birthDate: '1995-05-15',
    birthTime: '14:30',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    timeAccuracy: 'exact',
  })

  assert.equal(noTargetResult.raw.timing.periods, null)
  assert.ok(noTargetResult.raw.timing.daYun.cycles.length > 0)
  assert.equal(noTargetResult.raw.timing.daYun.cycles[0].isActive, null)

  // targetDate가 있는 정상 입력의 isActive boolean 동작 검증
  const withTargetResult = calculateSajuSystem({
    birthDate: '1995-05-15',
    birthTime: '14:30',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
  })
  assert.equal(typeof withTargetResult.raw.timing.daYun.cycles[0].isActive, 'boolean')
})

test('DST merged candidates preserve sourceCandidates, timezone candidates, equivalent_pillars comparison, and markdown export details', () => {
  const result = calculateSajuSystem({
    birthDate: '1987-10-11',
    birthTime: '02:30',
    calendar: 'solar',
    timezone: 'Asia/Seoul',
    gender: 'male',
    timeAccuracy: 'exact',
  })

  // 1. raw.candidates merged object includes sourceCandidates with distinct candidateId, inputAssumption, timezoneOffset, utcDateTime, timing
  const mergedCandidate = result.raw.candidates[0]
  assert.ok(mergedCandidate.sourceCandidates)
  assert.equal(mergedCandidate.sourceCandidates.length, 2)

  const sourceA = mergedCandidate.sourceCandidates.find((c) => c.candidateId === 'dst-standard')
  const sourceB = mergedCandidate.sourceCandidates.find((c) => c.candidateId === 'dst-daylight')
  assert.ok(sourceA)
  assert.ok(sourceB)
  assert.equal(sourceA.timezoneOffset, '+09:00')
  assert.equal(sourceB.timezoneOffset, '+10:00')
  assert.equal(sourceA.utcDateTime, '1987-10-10T17:30:00.000Z')
  assert.equal(sourceB.utcDateTime, '1987-10-10T16:30:00.000Z')
  assert.ok(sourceA.timing)
  assert.ok(sourceB.timing)

  // 2. historicalTimezone.candidates preserves both time candidates with candidateId, inputAssumption, utcDateTime, timezoneOffset
  const tzCandidates = result.raw.calculationUncertainty.historicalTimezone.candidates
  assert.equal(tzCandidates.length, 2)
  assert.equal(tzCandidates[0].candidateId, 'dst-standard')
  assert.equal(tzCandidates[1].candidateId, 'dst-daylight')

  // 3. candidateComparison status is equivalent_pillars and records structured diff
  assert.equal(result.raw.candidateComparison.status, 'equivalent_pillars')
  assert.ok(result.raw.candidateComparison.differences.some((d) => d.field === 'utcDateTime' || d.field === 'inputAssumption'))

  // 4. prepareInterpretationData export rendering includes candidate A/B details in markdown
  const rawPrepResult = prepareInterpretationData({
    birthDate: '1987-10-11',
    birthTime: '02:30',
    calendar: 'solar',
    gender: 'male',
    timezone: 'Asia/Seoul',
    targetDate: '2026-07-25',
    referenceCity: 'seoul',
    placeName: '서울',
    question: '종합운',
  })

  const payload = buildExportPayload(rawPrepResult, {
    type: 'dialogue',
    topicId: 'general',
    question: '종합운',
    generatedAt: '2026-07-25T00:00:00Z',
  })

  const markdown = exportPayloadToMarkdown(payload)
  assert.match(markdown, /해석 후보 \(Candidates A\/B\)/)
  assert.match(markdown, /표준시/)
  assert.match(markdown, /서머타임/)
  assert.match(markdown, /1987-10-10T17:30:00\.000Z/)
  assert.match(markdown, /1987-10-10T16:30:00\.000Z/)
})
