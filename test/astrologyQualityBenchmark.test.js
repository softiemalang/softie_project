import test from 'node:test'
import assert from 'node:assert/strict'
import { ASTROLOGY_BENCHMARK_CASES } from './fixtures/astrology/benchmarkCases.js'
import { evaluateAstrologyBenchmarkCase } from '../scratch/astrologyQualityBenchmark.js'

test('astrologyQualityBenchmark: validates contract & guardrails across 5 representative benchmark cases', () => {
  for (const testCase of ASTROLOGY_BENCHMARK_CASES) {
    const result = evaluateAstrologyBenchmarkCase(testCase)

    assert.equal(result.passed, true, `Case ${testCase.id} failed benchmark evaluation`)
    assert.equal(result.totalScore >= 10, true)
    assert.equal(result.scores.symbolicInterpretationSafety, 2)
  }
})
