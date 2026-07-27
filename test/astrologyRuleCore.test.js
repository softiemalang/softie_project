/**
 * astrologyRuleCore.test.js
 *
 * Mallang Astrology Rule Core v0 종합 단위 테스트 및 회귀 검증
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeDegrees360,
  normalizeSignedDegrees180,
  angularDistanceDegrees,
  isValidDegreeNumber,
} from '../src/astrology/astrologyAngles.js'
import { deriveSignPlacement, SIGN_BOUNDARY_THRESHOLD_DEGREES } from '../src/astrology/astrologySigns.js'
import { deriveMotionState, MOTION_EPSILON_DEGREES_PER_DAY } from '../src/astrology/astrologyMotion.js'
import { calculateWholeSignHouse, deriveWholeSignHouses } from '../src/astrology/astrologyHouses.js'
import { deriveMajorAspects, deriveAspectPhase } from '../src/astrology/astrologyAspects.js'
import { getSignMetadata, deriveChartRulers } from '../src/astrology/astrologyRulers.js'
import { deriveDistribution } from '../src/astrology/astrologyDistribution.js'
import { deriveAstrologyRuleChart, RULE_SET_VERSION } from '../src/astrology/astrologyRuleCore.js'

import {
  synthetic_astrology_rule_fixture_001,
  synthetic_sign_boundary_fixture,
  synthetic_aspect_phase_fixture,
  synthetic_missing_ascendant_fixture,
  synthetic_unsupported_body_fixture,
} from './fixtures/astrologyRuleFixtures.js'

// -----------------------------------------------------------------------------
// 1. 각도 정규화 (angle_rules)
// -----------------------------------------------------------------------------
test('astrologyAngles: normalizes 360 degrees and signed 180 degrees correctly', () => {
  assert.equal(normalizeDegrees360(0), 0)
  assert.equal(normalizeDegrees360(360), 0)
  assert.equal(normalizeDegrees360(720.25), 0.25)
  assert.equal(normalizeDegrees360(-1), 359)
  assert.equal(normalizeDegrees360(-360), 0)
  assert.equal(normalizeDegrees360(-721), 359)

  assert.equal(normalizeSignedDegrees180(0), 0)
  assert.equal(normalizeSignedDegrees180(180), -180)
  assert.equal(normalizeSignedDegrees180(179), 179)
  assert.equal(normalizeSignedDegrees180(359), -1)
  assert.equal(normalizeSignedDegrees180(-90), -90)

  assert.equal(angularDistanceDegrees(10, 350), 20)
  assert.equal(angularDistanceDegrees(359, 1), 2)
  assert.equal(angularDistanceDegrees(0, 180), 180)
})

test('astrologyAngles: handles invalid degree numbers cleanly', () => {
  const invalidValues = [NaN, Infinity, -Infinity, '123', null, undefined, {}, []]

  for (const inv of invalidValues) {
    assert.equal(isValidDegreeNumber(inv), false)
    assert.throws(() => normalizeDegrees360(inv), TypeError)
  }
})

// -----------------------------------------------------------------------------
// 2. 별자리 및 별자리 경계 (sign_rules)
// -----------------------------------------------------------------------------
test('astrologySigns: derives exact zodiac sign and boundary status', () => {
  assert.equal(deriveSignPlacement(0).signId, 'aries')
  assert.equal(deriveSignPlacement(0).degreeInSign, 0)

  assert.equal(deriveSignPlacement(29.999999).signId, 'aries')
  assert.equal(deriveSignPlacement(30).signId, 'taurus')
  assert.equal(deriveSignPlacement(30).degreeInSign, 0)

  assert.equal(deriveSignPlacement(59.999999).signId, 'taurus')
  assert.equal(deriveSignPlacement(60).signId, 'gemini')

  assert.equal(deriveSignPlacement(180).signId, 'libra')
  assert.equal(deriveSignPlacement(330).signId, 'pisces')
  assert.equal(deriveSignPlacement(359.999999).signId, 'pisces')
  assert.equal(deriveSignPlacement(360).signId, 'aries')

  // Boundary status tests (1 arcminute = 1/60 = 0.0166666667)
  const nearBoundary = deriveSignPlacement(30.005)
  assert.equal(nearBoundary.boundaryStatus, 'near_sign_boundary')
  assert.equal(nearBoundary.signId, 'taurus')

  const normalBoundary = deriveSignPlacement(35.0)
  assert.equal(normalBoundary.boundaryStatus, 'normal')
  assert.equal(normalBoundary.signId, 'taurus')
})

// -----------------------------------------------------------------------------
// 3. 운동 상태 (motion_rules)
// -----------------------------------------------------------------------------
test('astrologyMotion: derives motion state from longitude speed', () => {
  assert.equal(deriveMotionState(0.9731).motionState, 'direct')
  assert.equal(deriveMotionState(0.9731).retrograde, false)

  assert.equal(deriveMotionState(-0.42).motionState, 'retrograde')
  assert.equal(deriveMotionState(-0.42).retrograde, true)

  assert.equal(deriveMotionState(0).motionState, 'stationary')
  assert.equal(deriveMotionState(0).retrograde, false)

  assert.equal(deriveMotionState(0.00000005).motionState, 'stationary')
  assert.equal(deriveMotionState(-0.00000005).motionState, 'stationary')

  assert.equal(deriveMotionState(null).motionState, 'unavailable')
  assert.equal(deriveMotionState(undefined).motionState, 'unavailable')
})

// -----------------------------------------------------------------------------
// 4. Whole Sign 하우스 (whole_sign_house_rules)
// -----------------------------------------------------------------------------
test('astrologyHouses: calculates Whole Sign houses relative to Ascendant', () => {
  // ASC Virgo (5)
  assert.equal(calculateWholeSignHouse(5, 5), 1) // Virgo body -> 1
  assert.equal(calculateWholeSignHouse(6, 5), 2) // Libra body -> 2
  assert.equal(calculateWholeSignHouse(1, 5), 9) // Taurus body -> 9

  // ASC Pisces (11) + Aries body (0) -> 2
  assert.equal(calculateWholeSignHouse(0, 11), 2)

  // ASC Aries (0) + Pisces body (11) -> 12
  assert.equal(calculateWholeSignHouse(11, 0), 12)

  // ASC missing
  const resNoAsc = deriveWholeSignHouses({ ascendantPlacement: null })
  assert.equal(resNoAsc.availability, 'blocked')
  assert.equal(resNoAsc.reason, 'ascendant_unavailable')
  assert.equal(resNoAsc.fallbackApplied, false)
})

// -----------------------------------------------------------------------------
// 5. Major Aspects & Orb (aspect_rules)
// -----------------------------------------------------------------------------
test('astrologyAspects: calculates major aspects, exact orbs, deduplication and order independence', () => {
  const points = [
    { id: 'sun', longitudeDegrees: 359, speedDegreesPerDay: 1.0 },
    { id: 'moon', longitudeDegrees: 1, speedDegreesPerDay: 13.0 },
    { id: 'mercury', longitudeDegrees: 70, speedDegreesPerDay: 1.2 },
    { id: 'venus', longitudeDegrees: 100, speedDegreesPerDay: 1.1 },
    { id: 'mars', longitudeDegrees: 130, speedDegreesPerDay: 0.6 },
    { id: 'jupiter', longitudeDegrees: 190, speedDegreesPerDay: 0.1 },
  ]

  const aspects = deriveMajorAspects(points)

  // 359° and 1° -> conjunction, orb 2°
  const sunMoon = aspects.find((a) => a.id === 'sun__moon__conjunction')
  assert.notEqual(sunMoon, undefined)
  assert.equal(sunMoon.exactAngleDegrees, 0)
  assert.equal(sunMoon.orbDegrees, 2)

  // 10° (sun implicitly) vs 70° (mercury 70° vs sun 359° -> dist 71°; moon 1° vs mercury 70° -> dist 69°, orb 9°, exceeds maxOrb 5°)
  // Let's test explicit 10° vs 70°
  const explicitPoints = [
    { id: 'sun', longitudeDegrees: 10, speedDegreesPerDay: 1.0 },
    { id: 'moon', longitudeDegrees: 70, speedDegreesPerDay: 13.0 },
    { id: 'mercury', longitudeDegrees: 100, speedDegreesPerDay: 1.2 },
    { id: 'venus', longitudeDegrees: 130, speedDegreesPerDay: 1.1 },
    { id: 'mars', longitudeDegrees: 190, speedDegreesPerDay: 0.6 },
  ]

  const explicitAspects = deriveMajorAspects(explicitPoints)

  const sextile = explicitAspects.find((a) => a.id === 'sun__moon__sextile')
  assert.notEqual(sextile, undefined)
  assert.equal(sextile.exactAngleDegrees, 60)
  assert.equal(sextile.orbDegrees, 0)

  const square = explicitAspects.find((a) => a.id === 'sun__mercury__square')
  assert.notEqual(square, undefined)
  assert.equal(square.exactAngleDegrees, 90)

  const trine = explicitAspects.find((a) => a.id === 'sun__venus__trine')
  assert.notEqual(trine, undefined)
  assert.equal(trine.exactAngleDegrees, 120)

  const opp = explicitAspects.find((a) => a.id === 'sun__mars__opposition')
  assert.notEqual(opp, undefined)
  assert.equal(opp.exactAngleDegrees, 180)

  // Input array order independence test
  const reversedPoints = [...explicitPoints].reverse()
  const reversedAspects = deriveMajorAspects(reversedPoints)

  assert.deepEqual(
    explicitAspects.map((a) => a.id),
    reversedAspects.map((a) => a.id)
  )
})

// -----------------------------------------------------------------------------
// 6. Aspect Phase (aspect_phase_rules)
// -----------------------------------------------------------------------------
test('astrologyAspects: derives applying, separating, exact, indeterminate and unavailable aspect phases', () => {
  const chartRes = deriveAstrologyRuleChart(synthetic_aspect_phase_fixture)

  // Sun (10°, 1.0) & Moon (68°, 0.5) -> delta 58° (sextile 60°), target 60, signedOffset -2°, relSpeed -0.5 -> separating
  const sunMoon = chartRes.aspects.find((a) => a.id === 'sun__moon__sextile')
  assert.notEqual(sunMoon, undefined)
  assert.equal(sunMoon.phase, 'separating')

  // Sun (10°, 1.0) & Mercury (68°, 1.5) -> delta 58°, relSpeed +0.5 -> applying
  const sunMerc = chartRes.aspects.find((a) => a.id === 'sun__mercury__sextile')
  assert.notEqual(sunMerc, undefined)
  assert.equal(sunMerc.phase, 'applying')

  // Sun (10°, 1.0) & Venus (70°, 1.0) -> delta 60° (exact)
  const sunVenus = chartRes.aspects.find((a) => a.id === 'sun__venus__sextile')
  assert.notEqual(sunVenus, undefined)
  assert.equal(sunVenus.phase, 'exact')

  // Sun (10°, 1.0) & Mars (68°, 1.0) -> delta 58°, relSpeed 0 -> indeterminate
  const sunMars = chartRes.aspects.find((a) => a.id === 'sun__mars__sextile')
  assert.notEqual(sunMars, undefined)
  assert.equal(sunMars.phase, 'indeterminate')

  // Conjunction across 0° boundary test: 358° (speed 1.0) & 2° (speed 0.5) -> applying
  const conjPhaseApplying = deriveAspectPhase({
    pointA: 'sun',
    pointB: 'moon',
    aspectId: 'conjunction',
    lonA: 358,
    lonB: 2,
    speedA: 1.0,
    speedB: 0.5,
  })
  assert.equal(conjPhaseApplying.phase, 'applying')

  // Conjunction across 0° boundary test: 358° (speed 0.5) & 2° (speed 1.0) -> separating
  const conjPhaseSeparating = deriveAspectPhase({
    pointA: 'sun',
    pointB: 'moon',
    aspectId: 'conjunction',
    lonA: 358,
    lonB: 2,
    speedA: 0.5,
    speedB: 1.0,
  })
  assert.equal(conjPhaseSeparating.phase, 'separating')

  // Opposition across 180° boundary test: 178° (speed 1.0) & 359° (speed 0.5) -> applying
  const oppPhaseApplying = deriveAspectPhase({
    pointA: 'sun',
    pointB: 'moon',
    aspectId: 'opposition',
    lonA: 178,
    lonB: 359,
    speedA: 1.0,
    speedB: 0.5,
  })
  assert.equal(oppPhaseApplying.phase, 'applying')
})

// -----------------------------------------------------------------------------
// 7. 별자리 룰러 및 차트 룰러 (sign_metadata)
// -----------------------------------------------------------------------------
test('astrologyRulers: derives traditional and modern sign rulers and chart rulers', () => {
  assert.equal(getSignMetadata('virgo').traditionalRuler, 'mercury')
  assert.equal(getSignMetadata('virgo').modernRuler, 'mercury')

  assert.equal(getSignMetadata('scorpio').traditionalRuler, 'mars')
  assert.equal(getSignMetadata('scorpio').modernRuler, 'pluto')

  assert.equal(getSignMetadata('aquarius').traditionalRuler, 'saturn')
  assert.equal(getSignMetadata('aquarius').modernRuler, 'uranus')

  assert.equal(getSignMetadata('pisces').traditionalRuler, 'jupiter')
  assert.equal(getSignMetadata('pisces').modernRuler, 'neptune')

  // ASC Scorpio preserves both traditional (mars) and modern (pluto) chart rulers
  const scorpioAsc = { signId: 'scorpio', signIndex: 7 }
  const scorpioRulers = deriveChartRulers(scorpioAsc)
  assert.equal(scorpioRulers.availability, 'available')
  assert.equal(scorpioRulers.traditionalChartRuler, 'mars')
  assert.equal(scorpioRulers.modernChartRuler, 'pluto')
})

// -----------------------------------------------------------------------------
// 8. 분포 (distribution_rules)
// -----------------------------------------------------------------------------
test('astrologyDistribution: aggregates elements, modalities, polarities without forcing tie breakers', () => {
  const chartRes = deriveAstrologyRuleChart(synthetic_astrology_rule_fixture_001)

  assert.equal(chartRes.distribution.overall.totalBodiesCount, 10)
  assert.equal(chartRes.distribution.personal.totalBodiesCount, 5)

  // Verify tie handling does not pick a single fake leader
  const equalElementsPlacements = [
    { id: 'sun', signId: 'aries' }, // fire
    { id: 'moon', signId: 'taurus' }, // earth
    { id: 'mercury', signId: 'gemini' }, // air
    { id: 'venus', signId: 'cancer' }, // water
  ]
  const distTie = deriveDistribution(equalElementsPlacements)
  assert.equal(distTie.overall.elements.tie, true)
  assert.equal(distTie.overall.elements.leaders.length, 4)
})

// -----------------------------------------------------------------------------
// 9. 상태 계약 (state_contract)
// -----------------------------------------------------------------------------
test('astrologyRuleCore: preserves input verificationStatus, candidateId and handles missing ASC / unsupported bodies', () => {
  const noAscChart = deriveAstrologyRuleChart(synthetic_missing_ascendant_fixture)
  assert.equal(noAscChart.candidateId, 'synthetic_no_asc')
  assert.equal(noAscChart.verificationStatus, 'needs_verification')
  assert.equal(noAscChart.houses.availability, 'blocked')
  assert.equal(noAscChart.houses.reason, 'ascendant_unavailable')
  assert.equal(noAscChart.chartRulers.availability, 'blocked')

  const unsuppChart = deriveAstrologyRuleChart(synthetic_unsupported_body_fixture)
  assert.equal(unsuppChart.unsupportedBodies.length, 2)
  assert.equal(unsuppChart.unsupportedBodies[0].id, 'chiron')
  assert.equal(unsuppChart.unsupportedBodies[0].availability, 'unsupported')
  assert.equal(unsuppChart.unsupportedBodies[1].id, 'true_node')
  // Main bodies calculation still succeeds cleanly
  assert.equal(unsuppChart.bodies.length, 1)
  assert.equal(unsuppChart.bodies[0].id, 'sun')
})

// -----------------------------------------------------------------------------
// 10. 통합 규칙 코어 v0 (synthetic_001 full verification)
// -----------------------------------------------------------------------------
test('astrologyRuleCore: executes full v0 pipeline deterministically', () => {
  const chart = deriveAstrologyRuleChart(synthetic_astrology_rule_fixture_001)

  assert.equal(chart.schemaVersion, 'astrology-rule-chart-v0')
  assert.equal(chart.ruleSetVersion, RULE_SET_VERSION)
  assert.equal(chart.candidateId, 'synthetic_001')
  assert.equal(chart.bodies.length, 10)
  assert.equal(chart.angles.ascendant.signId, 'virgo')
  assert.equal(chart.angles.midheaven.signId, 'gemini')

  // Sun Taurus (1) + ASC Virgo (5) -> House 9
  const sun = chart.bodies.find((b) => b.id === 'sun')
  assert.equal(sun.signId, 'taurus')
  assert.equal(sun.motionState, 'direct')

  const houseSun = chart.houses.placements.find((p) => p.id === 'sun')
  assert.equal(houseSun.house, 9)

  // Rulers for ASC Virgo -> Mercury / Mercury
  assert.equal(chart.chartRulers.traditionalChartRuler, 'mercury')
  assert.equal(chart.chartRulers.modernChartRuler, 'mercury')

  // Determinism check: running twice with identical input produces exact identical output
  const chartSecond = deriveAstrologyRuleChart(synthetic_astrology_rule_fixture_001)
  assert.deepEqual(chart, chartSecond)
})
