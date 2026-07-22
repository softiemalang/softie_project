/**
 * Saju Validation Runner Unit Tests
 *
 * Executable via `node src/interpretationPrep/sajuValidationRunner.test.js`
 */

import test from 'node:test'
import assert from 'node:assert'
import {
  getNestedValue,
  compareValues,
  validateSingleFixture,
  runSajuValidationSuite,
  buildValidationReport
} from './sajuValidationRunner.js'
import { sajuValidationFixtures } from './fixtures/sajuValidationFixtures.js'
import { prepareInterpretationData } from './prepare.js'

test('Validation Runner: getNestedValue', () => {
  const sampleObj = {
    a: {
      b: {
        c: 'hello',
        d: [10, 20],
        e: null
      }
    }
  }

  assert.equal(getNestedValue(sampleObj, 'a.b.c'), 'hello')
  assert.equal(getNestedValue(sampleObj, 'a.b.d.0'), 10)
  assert.equal(getNestedValue(sampleObj, 'a.b.e'), null)
  assert.equal(getNestedValue(sampleObj, 'a.b.f'), undefined)
  assert.equal(getNestedValue(sampleObj, 'x.y'), undefined)
})

test('Validation Runner: compareValues (Primitives)', () => {
  // Matching primitives
  assert.deepEqual(compareValues('test', 'test'), { passed: true, reason: null })
  assert.deepEqual(compareValues(123, 123), { passed: true, reason: null })
  assert.deepEqual(compareValues(true, true), { passed: true, reason: null })

  // Value mismatches
  const valMismatch = compareValues('actual_val', 'expected_val')
  assert.equal(valMismatch.passed, false)
  assert.ok(valMismatch.reason.includes('value_mismatch'))

  // Type mismatches
  const typeMismatch = compareValues(123, '123')
  assert.equal(typeMismatch.passed, false)
  assert.ok(typeMismatch.reason.includes('type_mismatch'))
})

test('Validation Runner: compareValues (Arrays & Objects)', () => {
  // Matching arrays
  assert.deepEqual(compareValues([1, 2, 3], [1, 2, 3]), { passed: true, reason: null })

  // Array length mismatch
  const lenMismatch = compareValues([1, 2], [1, 2, 3])
  assert.equal(lenMismatch.passed, false)
  assert.ok(lenMismatch.reason.includes('array_length_mismatch'))

  // Array element mismatch
  const elemMismatch = compareValues([1, 9, 3], [1, 2, 3])
  assert.equal(elemMismatch.passed, false)
  assert.ok(elemMismatch.reason.includes('array_element_mismatch'))

  // Matching objects
  const obj1 = { x: 1, y: { z: 'deep' } }
  const obj2 = { x: 1, y: { z: 'deep' } }
  assert.deepEqual(compareValues(obj1, obj2), { passed: true, reason: null })

  // Nested mismatch
  const obj3 = { x: 1, y: { z: 'shallow' } }
  const objCmp = compareValues(obj3, obj1)
  assert.equal(objCmp.passed, false)
  assert.ok(objCmp.reason.includes('nested_mismatch'))
})

test('Validation Runner: Pending and Invalid Fixture Handling', () => {
  // Test pending_external_verification behavior: actual engine should run and generate mismatches,
  // but the final status is unconditionally 'pending' and passed is false.
  const pendingFixture = {
    id: 'test-pending',
    title: 'Pending Test',
    category: 'test',
    verificationStatus: 'pending_external_verification',
    input: {
      subjectName: 'Pending Test Input',
      birthDate: '1997-04-21',
      birthTime: '14:40',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: ['systems.saju.raw.pillars.year.referenceValue'],
    expected: {
      'systems.saju.raw.pillars.year.referenceValue': '무진' // deliberate mismatch to verify comparison still runs
    }
  }

  const result = validateSingleFixture(pendingFixture, prepareInterpretationData)

  // Confirms actual comparison occurred:
  assert.equal(result.status, 'pending') // status is locked to pending
  assert.equal(result.passed, false) // passed is locked to false
  assert.equal(result.failed, 1) // still tracking 1 mismatch
  assert.equal(result.mismatches.length, 1)
  assert.equal(result.mismatches[0].path, 'systems.saju.raw.pillars.year.referenceValue')

  // Zero assertions block testing (Task 1)
  const emptyAssertionFixture = {
    id: 'val-zero-assertions',
    title: 'Zero Assertions Test',
    category: 'test',
    verificationStatus: 'regression_only',
    expectedPaths: [], // empty paths
    expected: {}
  }
  const zeroAssertRes = validateSingleFixture(emptyAssertionFixture, prepareInterpretationData)
  assert.equal(zeroAssertRes.status, 'invalid_fixture')
  assert.equal(zeroAssertRes.passed, false)
  assert.equal(zeroAssertRes.mismatches.length, 1)
  assert.equal(zeroAssertRes.mismatches[0].reason, 'no_assertions')

  const invalidFixture = {
    verificationStatus: 'regression_only'
  }
  const invalidRes = validateSingleFixture(invalidFixture, prepareInterpretationData)
  assert.equal(invalidRes.status, 'invalid_fixture')
})

test('Validation Runner: Full Suite Aggregation and Report compilation', () => {
  const mockPrepare = (input) => {
    if (input.birthDate === 'invalid-lunar') return '입력하신 월은 해당 연도의 음력 윤달이 아닙니다.'
    return {
      systems: {
        saju: {
          status: 'experimental',
          raw: {
            dayMaster: { stem: '계' }
          }
        }
      }
    }
  }

  const mockFixtures = [
    {
      id: 'mock-1',
      title: '정상 양력',
      category: 'solar',
      verificationStatus: 'verified',
      input: { birthDate: '1997-04-21' },
      expectedPaths: ['systems.saju.raw.dayMaster.stem'],
      expected: { 'systems.saju.raw.dayMaster.stem': '계' }
    },
    {
      id: 'mock-2',
      title: '에러 유발',
      category: 'solar',
      verificationStatus: 'regression_only',
      input: { birthDate: '1997-04-21' },
      expectedPaths: ['systems.saju.raw.dayMaster.stem'],
      expected: { 'systems.saju.raw.dayMaster.stem': '갑' } // Mismatch
    },
    {
      id: 'mock-3',
      title: '펜딩 항목',
      category: 'lunar',
      verificationStatus: 'pending_external_verification',
      input: { birthDate: '1997-04-21' },
      expectedPaths: ['systems.saju.raw.dayMaster.stem'],
      expected: { 'systems.saju.raw.dayMaster.stem': '계' }
    }
  ]

  const summary = runSajuValidationSuite(mockFixtures, mockPrepare)

  assert.equal(summary.statistics.total, 3)
  assert.equal(summary.statistics.passed, 1) // mock-1 passed
  assert.equal(summary.statistics.failed, 1) // mock-2 failed
  assert.equal(summary.statistics.pending, 1) // mock-3 pending (forced to pending status)
  assert.equal(summary.statistics.verified.total, 1)
  assert.equal(summary.statistics.verified.passed, 1)
  assert.equal(summary.statistics.regressionOnly.total, 1)
  assert.equal(summary.statistics.regressionOnly.failed, 1)

  // Report generation compilation test
  const mdReport = buildValidationReport(summary)
  assert.ok(mdReport.includes('Saju Engine Integration Validation Report'))
  assert.ok(mdReport.includes('Summary Statistics'))
})

test('Validation Runner: Real Engine Integration (All 13 Fixtures)', () => {
  // Execute all 13 real fixtures using prepareInterpretationData to check full coverage
  const suiteResult = runSajuValidationSuite(sajuValidationFixtures, prepareInterpretationData)

  console.log('\n--- SAJU VALIDATION SUITE 13 FIXTURES REAL RUN RESULTS ---')
  console.log(`Fixture Version: ${suiteResult.fixtureVersion}`)
  console.log(`Generated At: ${suiteResult.generatedAt}`)
  console.log(`Statistics: Total ${suiteResult.statistics.total} | Passed ${suiteResult.statistics.passed} | Failed ${suiteResult.statistics.failed} | Pending ${suiteResult.statistics.pending} | Invalid ${suiteResult.statistics.invalid}\n`)

  assert.equal(suiteResult.results.length, 13)

  for (const singleRes of suiteResult.results) {
    console.log(`- [${singleRes.verificationStatus.toUpperCase()}] ${singleRes.title} (${singleRes.fixtureId}): Status=${singleRes.status}, PassedPaths=${singleRes.total - singleRes.failed}/${singleRes.total}`)

    if (singleRes.fixtureId === 'val-pending-external') {
      // Pending external verification is executed and comparison succeeds, but status is unconditionally 'pending'
      assert.equal(singleRes.status, 'pending')
      assert.equal(singleRes.passed, false)
      assert.equal(singleRes.failed, 0, 'No mismatches expected on val-pending-external')
    } else if (singleRes.fixtureId === 'val-lunar-invalid-date') {
      // Expected validation error caught and successfully matched substring
      assert.equal(singleRes.status, 'passed')
      assert.equal(singleRes.passed, true)
    } else {
      // All other 11 regression_only fixtures are expected to match perfectly with the engine
      assert.equal(singleRes.status, 'passed', `Fixture ${singleRes.fixtureId} failed with ${singleRes.failed} mismatches: ${JSON.stringify(singleRes.mismatches)}`)
      assert.equal(singleRes.passed, true)
    }
  }
  console.log('----------------------------------------------------------\n')
})
