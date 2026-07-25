import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
  ASTROLOGY_CHART_SYSTEM_DEFAULTS,
} from '../src/astrology/astrologyContract.js'

test('astrologyContract: creates normalized calculation context with western_tropical_placidus_v1 ruleSet', () => {
  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '점성학테스트',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 10,
      birthTime: '14:30',
    },
    chart: {
      planets: [
        { planet: 'sun', sign: 'taurus', degree: 19.5, house: 9 },
        { planet: 'moon', sign: 'scorpio', degree: 5.2, house: 3 },
      ],
      angles: {
        ascendant: { sign: 'virgo', degree: 12.1 },
        mc: { sign: 'gemini', degree: 8.4 },
      },
    },
  })

  assert.equal(calcCtx.systemType, 'astrology')
  assert.equal(calcCtx.chartSystem.ruleSetVersion, 'western_tropical_placidus_v1')
  assert.equal(calcCtx.chartSystem.zodiac, 'tropical')
  assert.equal(calcCtx.chartSystem.houseSystem, 'placidus')
  assert.equal(calcCtx.calculationConfidence.stateContract.confidence, 'high')

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  assert.equal(interpCtx.systemType, 'astrology')
  assert.equal(interpCtx.candidateSetConsensus.factual.sunSign, 'taurus')
  assert.equal(interpCtx.candidateSetConsensus.factual.ascendant, 'virgo')
  assert.equal(interpCtx.uncertainFactors.length, 0)
})

test('astrologyContract: flags low confidence and uncertainFactors when birth time is missing', () => {
  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '시간미상점성학',
      birthYear: 1992,
      birthMonth: 8,
      birthDay: 20,
    },
  })

  assert.equal(calcCtx.calculationConfidence.stateContract.confidence, 'low')
  assert.equal(calcCtx.calculationConfidence.stateContract.requiresUserAction, true)

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  assert.equal(interpCtx.uncertainFactors.length, 1)
  assert.equal(interpCtx.uncertainFactors[0].field, 'ascendant_and_houses')
  assert.equal(interpCtx.uncertainFactors[0].impact, 'houses_and_angles_uncertain')
})
