import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePlanets } from '../src/astrology/planetResolver.js'
import { resolveHouses, assignHousesToPlanets } from '../src/astrology/houseResolver.js'
import { resolveAspects, calculateElementsAndModalities } from '../src/astrology/aspectResolver.js'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
} from '../src/astrology/astrologyContract.js'

test('astrologyResolvers: labels seeded planet output as simulation-only and not astronomical', () => {
  const planetRes = resolvePlanets({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  assert.equal(planetRes.planets.length, 10)
  assert.equal(planetRes.calculationMeta.status, 'simulation_only')
  assert.equal(planetRes.calculationMeta.availableForInterpretation, false)
  assert.equal(planetRes.calculationMeta.ephemerisSource, 'date_seed_simulation')
  assert.equal(planetRes.calculationMeta.accuracy, 'not_astronomical')
  assert.equal(planetRes.calculationMeta.verifiedAgainst, null)
  assert.equal(planetRes.planets[0].planet, 'sun')
})

test('astrologyResolvers: labels seeded houses as simulation-only even when birth time is present', () => {
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

  assert.equal(houseRes.houseCalculationMeta.status, 'simulation_only')
  assert.equal(houseRes.houseCalculationMeta.confidence, 'not_available')
  assert.equal(houseRes.houseCalculationMeta.availableForInterpretation, false)
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
