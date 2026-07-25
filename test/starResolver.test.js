import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateZiweiBranch, calculateTianfuBranch } from '../src/ziwei/starPlacementRules.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { KNOWN_STAR_PLACEMENT_CHARTS } from './fixtures/ziwei/starPlacementCharts.js'

test('starPlacementRules: verifies ziwei and tianfu star branches against known fixtures', () => {
  KNOWN_STAR_PLACEMENT_CHARTS.forEach((chart) => {
    const ziweiB = calculateZiweiBranch(chart.input.bureauNumber, chart.input.lunarDay)
    const tianfuB = calculateTianfuBranch(ziweiB)

    assert.equal(ziweiB, chart.expected.ziweiBranch, `Failed ziweiBranch for ${chart.id}`)
    assert.equal(tianfuB, chart.expected.tianfuBranch, `Failed tianfuBranch for ${chart.id}`)
  })
})

test('starResolver: places all 14 major stars into chart palaces with ruleSetVersion', () => {
  const chartCtx = resolveZiweiChart({
    subjectName: '주성테스트',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })

  const starsRes = resolve14MajorStars({
    bureauNumber: chartCtx.chart.fiveElementsBureau.number,
    lunarDay: 15,
    palaces: chartCtx.chart.palaces,
  })

  assert.equal(starsRes.majorStars.length, 14)
  assert.equal(starsRes.majorStars[0].id, 'ziwei')
  assert.equal(starsRes.majorStars[0].ruleSetVersion, 'traditional_v1')
  assert.equal(starsRes.starPlacementMeta.ruleSetVersion, 'traditional_v1')
  assert.ok(starsRes.majorStars.every((s) => s.palaceBranch !== null))
})
