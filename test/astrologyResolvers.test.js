import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePlanets } from '../src/astrology/planetResolver.js'
import { resolveHouses, assignHousesToPlanets } from '../src/astrology/houseResolver.js'
import { resolveAspects, calculateElementsAndModalities } from '../src/astrology/aspectResolver.js'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
} from '../src/astrology/astrologyContract.js'

test('astrologyResolvers: calculates 10 planets with ephemeris metadata and ruleSet', () => {
  const planetRes = resolvePlanets({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  assert.equal(planetRes.planets.length, 10)
  assert.equal(planetRes.calculationMeta.ephemerisSource, 'meeus_approx_v1')
  assert.equal(planetRes.planets[0].planet, 'sun')
})

test('astrologyResolvers: resolves houses and assigns to planets when birth time is present', () => {
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
    latitude: 37.56,
    longitude: 126.97,
  })

  assert.equal(houseRes.houseCalculationMeta.confidence, 'high')
  assert.equal(houseRes.houses.length, 12)
  assert.notEqual(houseRes.angles.ascendant, null)

  const planetsWithHouses = assignHousesToPlanets(planetRes.planets, houseRes.houses)
  assert.equal(planetsWithHouses[0].house >= 1 && planetsWithHouses[0].house <= 12, true)
})

test('astrologyResolvers: calculates aspects, elements, modalities and maps to InterpretationContext', () => {
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

  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '통합점성학',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 10,
      birthTime: '14:30',
    },
    chart: {
      chartSystem: planetRes.calculationMeta,
      planets: planetsWithHouses,
      angles: houseRes.angles,
      houses: houseRes.houses,
      aspects: aspectRes.aspects,
      elementsAndModalities: elemModRes,
    },
  })

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  assert.equal(interpCtx.systemType, 'astrology')
  assert.equal(interpCtx.candidateSetConsensus.factual.sunSign !== 'unknown', true)
  assert.equal(interpCtx.calculationConfidence.stateContract.confidence, 'high')
})
