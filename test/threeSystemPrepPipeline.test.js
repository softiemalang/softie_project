import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'

const INPUT = {
  subjectName: '파이프라인테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  targetDate: '2026-07-26',
  placeName: '대한민국',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

test('three-system pipeline builds real saju CalculationContext and keeps detailed raw evidence', () => {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  const saju = prepared.systems.saju

  assert.equal(saju.availableForChat, true)
  assert.equal(saju.calculationResult.raw.pillars.day.value, '계사')
  assert.equal(saju.interpretationContext.candidateSetConsensus.factual.dayMaster, '계')
  assert.ok(saju.calculationResult.raw.elements)
  assert.ok(saju.calculationResult.raw.tenGods)
  assert.ok(saju.calculationResult.raw.hiddenStems)
  assert.ok(saju.calculationResult.raw.stemRelations)
  assert.ok(saju.calculationResult.raw.branchRelations)
  assert.ok(saju.calculationResult.raw.timing.daYun)
  assert.equal(saju.calculationResult.raw.timing.periods.year.value, '병오')
})
test('three-system pipeline derives lunar input and builds experimental Ziwei contexts with all resolvers', () => {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  const ziwei = prepared.systems.ziwei

  assert.equal(ziwei.status, 'experimental')
  assert.equal(ziwei.verificationStatus, 'needs_external_verification')
  assert.equal(ziwei.confidence, 'medium')
  assert.equal(ziwei.availableForChat, true)
  assert.equal(ziwei.calculationResult.input.lunarYear, 1997)
  assert.equal(ziwei.calculationResult.input.lunarMonth, 3)
  assert.equal(ziwei.calculationResult.input.lunarDay, 15)
  assert.ok(ziwei.calculationResult.chart.mingGong)
  assert.ok(ziwei.calculationResult.chart.shenGong)
  assert.ok(ziwei.calculationResult.chart.fiveElementsBureau)
  assert.equal(ziwei.calculationResult.chart.palaces.length, 12)
  assert.equal(ziwei.calculationResult.chart.majorStars.length, 14)
  assert.equal(ziwei.calculationResult.chart.transformations.length, 4)
  assert.ok(ziwei.calculationResult.chart.minorStars.length > 0)
  assert.equal(Object.keys(ziwei.interpretationContext.palaceContexts).length, 12)
  assert.ok(ziwei.interpretationContext.interpretivePatterns.careerPattern)
  assert.ok(ziwei.interpretationContext.interpretivePatterns.relationshipPattern)
})

test('three-system pipeline blocks simulated astrology from interpretation and unified themes', () => {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  const astrology = prepared.systems.astrology

  assert.equal(astrology.status, 'simulation_blocked')
  assert.equal(astrology.verificationStatus, 'unsupported_for_interpretation')
  assert.equal(astrology.availableForChat, false)
  assert.equal(astrology.confidence, 'not_available')
  assert.equal(astrology.calculationResult, null)
  assert.equal(astrology.interpretationContext, null)
  assert.equal(prepared.unifiedContext.sharedThemes[0].evidence.astrology, undefined)
})

test('three-system pipeline does not collapse unknown birth time into a single Ziwei chart', () => {
  const prepared = prepareThreeSystemInterpretationData({
    ...INPUT,
    birthTime: '',
    timeAccuracy: 'unknown',
  })

  assert.equal(prepared.systems.ziwei.availableForChat, false)
  assert.equal(prepared.systems.ziwei.verificationStatus, 'candidate_required')
  assert.equal(prepared.systems.ziwei.calculationResult, null)
})

test('frontend exposes only the simple Chat handoff flow and does not import Lab session UI', () => {
  const pageSource = fs.readFileSync(
    new URL('../src/interpretationPrep/InterpretationPrepPage.jsx', import.meta.url),
    'utf8',
  )
  const cardSource = fs.readFileSync(
    new URL('../src/interpretationPrep/components/ChatHandoffCard.jsx', import.meta.url),
    'utf8',
  )

  assert.match(pageSource, /ChatHandoffCard/)
  assert.match(pageSource, /prepareThreeSystemInterpretationData/)
  assert.doesNotMatch(pageSource, /InterpretationSessionView/)
  assert.doesNotMatch(pageSource, /LensTabs/)
  assert.doesNotMatch(pageSource, /ReflectionCard/)
  assert.doesNotMatch(pageSource, /UserInsightMemory/)
  assert.doesNotMatch(pageSource, /sessionResponsePipeline/)
  assert.match(cardSource, /q\.trim\(\) \|\| presetQuestion/)
})
