import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'

test('transformationResolver: resolves 4 transformations for 甲 year stem with correct star IDs and version', () => {
  const res = resolveFourTransformations('甲')

  assert.equal(res.transformations.length, 4)
  assert.equal(res.transformations[0].starId, 'lianzhen') // 염정화록
  assert.equal(res.transformations[1].starId, 'pojun')    // 파군화권
  assert.equal(res.transformations[2].starId, 'wugu')     // 무곡화과
  assert.equal(res.transformations[3].starId, 'taiyang')   // 태양화기
  assert.equal(res.transformationMeta.ruleSetVersion, 'traditional_v1')
})

test('minorStarResolver: places 6 lucky stars into palaces with ruleSetVersion', () => {
  const chartCtx = resolveZiweiChart({
    subjectName: '보조성테스트',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })

  const minorRes = resolveMinorStars({
    birthYearStem: '庚',
    lunarMonth: 5,
    hourBranch: '午',
    palaces: chartCtx.chart.palaces,
  })

  assert.equal(minorRes.minorStars.length, 6)
  assert.equal(minorRes.minorStars[0].id, 'zuobo')
  assert.equal(minorRes.minorStarMeta.ruleSetVersion, 'traditional_v1')
  assert.ok(minorRes.minorStars.every((s) => s.palaceBranch !== null))
})
