import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'

test('ziweiPipeline: executes full pipeline from input to ZiweiInterpretationContext with trine/opposite relations', () => {
  // 1. Base chart (Ming/Shen Gong & Palace Layout)
  const baseChartCtx = resolveZiweiChart({
    subjectName: '전체파이프라인테스트',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })

  const chart = baseChartCtx.chart

  // 2. 14 Major Stars
  const majorRes = resolve14MajorStars({
    bureauNumber: chart.fiveElementsBureau.number,
    lunarDay: 15,
    palaces: chart.palaces,
  })
  chart.majorStars = majorRes.majorStars

  // 3. Four Transformations (사화)
  const transRes = resolveFourTransformations('庚')
  chart.transformations = transRes.transformations

  // 4. Minor Stars (육길성)
  const minorRes = resolveMinorStars({
    birthYearStem: '庚',
    lunarMonth: 5,
    hourBranch: '午',
    palaces: chart.palaces,
  })
  chart.minorStars = minorRes.minorStars

  // 5. Build ZiweiCalculationContext
  const calcCtx = createZiweiCalculationContext({
    input: {
      subjectName: '전체파이프라인테스트',
      birthYearStem: '庚',
      birthYearBranch: '午',
      lunarMonth: 5,
      hourBranch: '午',
    },
    chart,
    calculationMeta: baseChartCtx.calculationMeta,
  })

  // 6. Build ZiweiInterpretationContext
  const interpCtx = createZiweiInterpretationContext(calcCtx)

  assert.equal(interpCtx.systemType, 'ziwei')
  assert.equal(interpCtx.subjectName, '전체파이프라인테스트')

  // Check palaceContexts & relationship (Trine & Opposite)
  const lifeContext = interpCtx.palaceContexts['life']
  assert.ok(lifeContext)
  assert.equal(lifeContext.palaceId, 'life')
  assert.ok(lifeContext.relationship.opposite.palaceId === 'travel') // 명궁 대궁 = 천이궁
  assert.equal(lifeContext.relationship.trine.palaces.length, 2)       // 삼방궁 2개 (관록, 재백)

  // Check interpretivePatterns
  assert.ok(interpCtx.interpretivePatterns.careerPattern)
  assert.ok(interpCtx.interpretivePatterns.wealthPattern)
  assert.ok(interpCtx.interpretivePatterns.relationshipPattern)
})
