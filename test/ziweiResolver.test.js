import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolveFiveElementBureau } from '../src/ziwei/fiveElementResolver.js'
import { KNOWN_ZIWEI_CHARTS } from './fixtures/ziwei/knownCharts.js'

test('ziweiResolver: verifies known chart sample 1 (lunar 5, hour wu)', () => {
  const sample1 = KNOWN_ZIWEI_CHARTS[0]
  const chartCtx = resolveZiweiChart({
    subjectName: '테스트1',
    lunarMonth: sample1.input.lunarMonth,
    hourBranch: sample1.input.hourBranch,
    birthYearStem: sample1.input.birthYearStem,
  })

  assert.equal(chartCtx.chart.mingGong.branch, sample1.expected.mingGongBranch)
  assert.equal(chartCtx.chart.shenGong.branch, sample1.expected.shenGongBranch)
  assert.equal(chartCtx.chart.fiveElementsBureau.name, sample1.expected.fiveElementsBureau.name)
  assert.equal(chartCtx.chart.palaces.length, 12)
})

test('ziweiResolver: verifies known chart sample 2 (lunar 1, hour zi)', () => {
  const sample2 = KNOWN_ZIWEI_CHARTS[1]
  const chartCtx = resolveZiweiChart({
    subjectName: '테스트2',
    lunarMonth: sample2.input.lunarMonth,
    hourBranch: sample2.input.hourBranch,
    birthYearStem: sample2.input.birthYearStem,
  })

  assert.equal(chartCtx.chart.mingGong.branch, sample2.expected.mingGongBranch)
  assert.equal(chartCtx.chart.shenGong.branch, sample2.expected.shenGongBranch)
  assert.equal(chartCtx.chart.fiveElementsBureau.name, sample2.expected.fiveElementsBureau.name)
})

test('ziweiResolver: leap month generates low confidence and candidates alternatives', () => {
  const sample3 = KNOWN_ZIWEI_CHARTS[2]
  const chartCtx = resolveZiweiChart({
    subjectName: '윤달테스트',
    lunarMonth: sample3.input.lunarMonth,
    hourBranch: sample3.input.hourBranch,
    birthYearStem: sample3.input.birthYearStem,
    isLeapMonth: true,
  })

  assert.equal(chartCtx.calculationMeta.confidence, 'low')
  assert.equal(chartCtx.candidates.candidateOrigin, 'leap_month_boundary')
  assert.equal(chartCtx.candidates.alternatives.length, 2)
})

test('fiveElementResolver: maps birth year stem and ming gong branch correctly', () => {
  const bureau = resolveFiveElementBureau('庚', '子')
  assert.equal(bureau.id, 'fire_6')
  assert.equal(bureau.name, '화육국')
})
