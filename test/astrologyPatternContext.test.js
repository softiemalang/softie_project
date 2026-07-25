import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePlanets } from '../src/astrology/planetResolver.js'
import { resolveHouses, assignHousesToPlanets } from '../src/astrology/houseResolver.js'
import { resolveAspects, calculateElementsAndModalities } from '../src/astrology/aspectResolver.js'
import { extractAstrologyPatterns } from '../src/astrology/astrologyPatternContext.js'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
} from '../src/astrology/astrologyContract.js'

test('astrologyPatternContext: extracts element/modality dominance, house axes and aspect patterns', () => {
  const planetRes = resolvePlanets({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  const houseRes = resolveHouses({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  const planetsWithHouses = assignHousesToPlanets(planetRes.planets, houseRes.houses)
  const aspectRes = resolveAspects(planetsWithHouses)
  const elemModRes = calculateElementsAndModalities(planetsWithHouses)

  const patternRes = extractAstrologyPatterns({
    planets: planetsWithHouses,
    houses: houseRes.houses,
    aspects: aspectRes.aspects,
    elementsAndModalities: elemModRes,
  })

  assert.equal(patternRes.houseAxes.length, 3)
  assert.equal(patternRes.houseAxes[0].axisId, '1H_7H_self_relationship_axis')
  assert.equal(patternRes.houseAxes[1].axisId, '4H_10H_foundation_career_axis')
  assert.equal(patternRes.houseAxes[2].axisId, '2H_8H_personal_shared_resources_axis')

  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '패턴테스트',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 10,
      birthTime: '14:30',
    },
    chart: {
      planets: planetsWithHouses,
      angles: houseRes.angles,
      houses: houseRes.houses,
      aspects: aspectRes.aspects,
      elementsAndModalities: elemModRes,
    },
  })

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  assert.equal(interpCtx.candidateSetConsensus.interpretiveAgreement.houseAxes.length, 3)
  assert.equal(Array.isArray(interpCtx.candidateSetConsensus.interpretiveAgreement.majorPatterns), true)
})
