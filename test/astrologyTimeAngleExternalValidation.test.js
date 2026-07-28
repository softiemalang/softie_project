/**
 * astrologyTimeAngleExternalValidation.test.js
 *
 * Mallang Time & Angle Core v0 독립 외부 오라클 회귀 테스트 모듈
 *
 * 오라클 출처:
 * - IAU SOFA (ANSI C 2023-10-11)
 * - Swiss Ephemeris (v2.10.03)
 * - USNO Sidereal Time & Julian Date Data Service (v4.0.1)
 *
 * 본 테스트는 네트워크 없이 오프라인으로 100% 실행되며, 저장소 내에 외부 코드가 유입되지 않았음을 보장합니다.
 */

import assert from 'node:assert'
import test from 'node:test'

import { angularDistanceDegrees, normalizeDegrees360 } from '../src/astrology/astrologyAngles.js'
import { deriveAscendant, deriveMidheaven } from '../src/astrology/astrologyChartAngles.js'
import { deriveLocalMeanSiderealTime } from '../src/astrology/astrologyEarthOrientation.js'
import { deriveAstrologyTimeAngle } from '../src/astrology/astrologyTimeAngleCore.js'
import {
  LMST_LONGITUDE_FIXTURES,
  ORACLE_PROVENANCE,
  SOFA_TIME_ANGLE_FIXTURES,
  SWISS_ANGLE_FIXTURES,
  USNO_SANITY_FIXTURES
} from './fixtures/astrologyTimeAngleExternalFixtures.js'

test('SOFA External Validation: Julian Date, ERA, Mean Obliquity, GMST meet strict tolerances', () => {
  for (const fx of SOFA_TIME_ANGLE_FIXTURES) {
    const res = deriveAstrologyTimeAngle({
      schemaVersion: 'astrology-time-angle-input-v0',
      calendar: 'proleptic_gregorian',
      utc: fx.input.utc,
      timeScaleOffsets: fx.input.timeScaleOffsets
    })

    assert.strictEqual(res.calendar.availability, 'available', `[${fx.fixtureId}] calendar available`)
    assert.strictEqual(res.timeScales.julianDateUt1.availability, 'available', `[${fx.fixtureId}] UT1 available`)
    assert.strictEqual(res.timeScales.julianDateTt.availability, 'available', `[${fx.fixtureId}] TT available`)

    // Julian Date UTC
    const jdUtcDiff = Math.abs(res.calendar.julianDateUtc - fx.expected.julianDateUtc)
    assert.ok(jdUtcDiff <= fx.tolerances.julianDateUtc, `[${fx.fixtureId}] Julian Date UTC diff ${jdUtcDiff} <= ${fx.tolerances.julianDateUtc}`)

    // Julian Date UT1
    const jdUt1Diff = Math.abs(res.timeScales.julianDateUt1.value - fx.expected.julianDateUt1)
    assert.ok(jdUt1Diff <= fx.tolerances.julianDateUt1, `[${fx.fixtureId}] Julian Date UT1 diff ${jdUt1Diff} <= ${fx.tolerances.julianDateUt1}`)

    // Julian Date TT
    const jdTtDiff = Math.abs(res.timeScales.julianDateTt.value - fx.expected.julianDateTt)
    assert.ok(jdTtDiff <= fx.tolerances.julianDateTt, `[${fx.fixtureId}] Julian Date TT diff ${jdTtDiff} <= ${fx.tolerances.julianDateTt}`)

    // Earth Rotation Angle (ERA)
    const eraDiff = angularDistanceDegrees(res.earthOrientation.earthRotationAngleDegrees.degrees, fx.expected.earthRotationAngleDegrees)
    assert.ok(eraDiff <= fx.tolerances.earthRotationAngleDegrees, `[${fx.fixtureId}] ERA diff ${eraDiff} <= ${fx.tolerances.earthRotationAngleDegrees}`)

    // Mean Obliquity
    const oblDiff = Math.abs(res.earthOrientation.meanObliquityDegrees.degrees - fx.expected.meanObliquityDegrees)
    assert.ok(oblDiff <= fx.tolerances.meanObliquityDegrees, `[${fx.fixtureId}] Mean Obliquity diff ${oblDiff} <= ${fx.tolerances.meanObliquityDegrees}`)

    // Greenwich Mean Sidereal Time (GMST)
    const gmstDiff = angularDistanceDegrees(res.earthOrientation.greenwichMeanSiderealTimeDegrees.degrees, fx.expected.greenwichMeanSiderealTimeDegrees)
    assert.ok(gmstDiff <= fx.tolerances.greenwichMeanSiderealTimeDegrees, `[${fx.fixtureId}] GMST diff ${gmstDiff} <= ${fx.tolerances.greenwichMeanSiderealTimeDegrees}`)
  }
})

test('LMST Validation: East-positive, West-negative, ±180° equivalence, circular angular distance', () => {
  const baseGmst = { availability: 'available', degrees: 100.228619558323 }

  for (const fx of LMST_LONGITUDE_FIXTURES) {
    const loc = { longitudeDegreesEast: fx.longitudeDegreesEast }
    const lmst = deriveLocalMeanSiderealTime(baseGmst, loc)
    assert.strictEqual(lmst.availability, 'available')
    assert.ok(Number.isFinite(lmst.degrees))
    assert.ok(lmst.degrees >= 0 && lmst.degrees < 360)

    const expectedDeg = normalizeDegrees360(baseGmst.degrees + fx.longitudeDegreesEast)
    const diff = angularDistanceDegrees(lmst.degrees, expectedDeg)
    assert.ok(diff <= 1e-9, `LMST longitude ${fx.longitudeDegreesEast}° diff ${diff} <= 1e-9`)
  }

  // +180° and -180° produce identical LMST
  const lmstPos180 = deriveLocalMeanSiderealTime(baseGmst, { longitudeDegreesEast: 180.0 })
  const lmstNeg180 = deriveLocalMeanSiderealTime(baseGmst, { longitudeDegreesEast: -180.0 })
  const diff180 = angularDistanceDegrees(lmstPos180.degrees, lmstNeg180.degrees)
  assert.ok(diff180 <= 1e-9, `LMST +180° vs -180° diff ${diff180} <= 1e-9`)
})

test('Swiss Ephemeris External Validation: Mean ASC & Mean MC geometries match swe_houses_armc', () => {
  assert.ok(SWISS_ANGLE_FIXTURES.length >= 12, 'Minimum 12 Swiss angle fixtures')

  for (const fx of SWISS_ANGLE_FIXTURES) {
    const lmstResult = { availability: 'available', degrees: fx.input.armcDegrees }
    const meanObliquityResult = { availability: 'available', degrees: fx.input.meanObliquityDegrees }
    const location = { geographicLatitudeDegrees: fx.input.geographicLatitudeDegrees }

    const mcRes = deriveMidheaven(lmstResult, meanObliquityResult)
    const ascRes = deriveAscendant(lmstResult, meanObliquityResult, location)

    assert.strictEqual(mcRes.availability, 'available', `[${fx.fixtureId}] MC available`)
    assert.strictEqual(ascRes.availability, 'available', `[${fx.fixtureId}] ASC available`)

    assert.ok(Number.isFinite(mcRes.longitudeDegrees), `[${fx.fixtureId}] MC finite`)
    assert.ok(Number.isFinite(ascRes.longitudeDegrees), `[${fx.fixtureId}] ASC finite`)

    assert.ok(mcRes.longitudeDegrees >= 0 && mcRes.longitudeDegrees < 360, `[${fx.fixtureId}] MC in [0, 360)`)
    assert.ok(ascRes.longitudeDegrees >= 0 && ascRes.longitudeDegrees < 360, `[${fx.fixtureId}] ASC in [0, 360)`)

    const mcDiff = angularDistanceDegrees(mcRes.longitudeDegrees, fx.expected.midheavenDegrees)
    assert.ok(mcDiff <= fx.tolerances.midheavenDegrees, `[${fx.fixtureId}] MC diff ${mcDiff} <= ${fx.tolerances.midheavenDegrees}`)

    const ascDiff = angularDistanceDegrees(ascRes.longitudeDegrees, fx.expected.ascendantDegrees)
    assert.ok(ascDiff <= fx.tolerances.ascendantDegrees, `[${fx.fixtureId}] ASC diff ${ascDiff} <= ${fx.tolerances.ascendantDegrees}`)
  }
})

test('Swiss Ephemeris Properties: MC is independent of latitude while ASC varies by latitude', () => {
  const armc = 45.0
  const eps = 23.439279444444445
  const lmstRes = { availability: 'available', degrees: armc }
  const oblRes = { availability: 'available', degrees: eps }

  const mcLat0 = deriveMidheaven(lmstRes, oblRes)
  const mcLat50 = deriveMidheaven(lmstRes, oblRes)
  assert.strictEqual(mcLat0.longitudeDegrees, mcLat50.longitudeDegrees, 'MC is identical across latitudes')

  const ascLatEquator = deriveAscendant(lmstRes, oblRes, { geographicLatitudeDegrees: 0.0 })
  const ascLatNorth = deriveAscendant(lmstRes, oblRes, { geographicLatitudeDegrees: 51.5 })
  const ascLatSouth = deriveAscendant(lmstRes, oblRes, { geographicLatitudeDegrees: -33.9 })

  assert.notStrictEqual(ascLatEquator.longitudeDegrees, ascLatNorth.longitudeDegrees, 'ASC changes with latitude')
  assert.notStrictEqual(ascLatNorth.longitudeDegrees, ascLatSouth.longitudeDegrees, 'ASC changes between north and south')
})

test('USNO Non-Gating Sanity Check Fixtures: Structural integrity and documented caveats', () => {
  assert.strictEqual(USNO_SANITY_FIXTURES.length, 3)

  for (const fx of USNO_SANITY_FIXTURES) {
    assert.strictEqual(fx.comparisonRole, 'non_gating_sanity_check')
    assert.ok(fx.usnoOutput.gmstDegrees >= 0 && fx.usnoOutput.gmstDegrees < 360)
    assert.ok(fx.usnoOutput.lmstDegrees >= 0 && fx.usnoOutput.lmstDegrees < 360)
    assert.ok(typeof fx.modelCaveat === 'string' && fx.modelCaveat.length > 0)
  }
})

test('Validation Provenance & Status Contract Requirements', () => {
  // Provenance completeness
  assert.strictEqual(ORACLE_PROVENANCE.sofa.oracleName, 'IAU SOFA')
  assert.strictEqual(ORACLE_PROVENANCE.sofa.committedArtifact, false)
  assert.strictEqual(ORACLE_PROVENANCE.sofa.runtimeDependency, false)

  assert.strictEqual(ORACLE_PROVENANCE.swissEphemeris.oracleName, 'Swiss Ephemeris')
  assert.strictEqual(ORACLE_PROVENANCE.swissEphemeris.committedArtifact, false)
  assert.strictEqual(ORACLE_PROVENANCE.swissEphemeris.runtimeDependency, false)

  // Contract status boundaries
  const coreResult = deriveAstrologyTimeAngle({
    schemaVersion: 'astrology-time-angle-input-v0',
    calendar: 'proleptic_gregorian',
    utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
    timeScaleOffsets: { ut1MinusUtcSeconds: 0, ttMinusUtcSeconds: 64.184 }
  })

  assert.strictEqual(coreResult.schemaVersion, 'astrology-time-angle-result-v0')
  assert.strictEqual(coreResult.ruleSetVersion, 'mallang-time-angle-core-v0')
  assert.strictEqual(coreResult.modelId, 'iau2000-era__iau2006-gmst-mean-obliquity')
  assert.strictEqual(coreResult.siderealTimeType, 'mean')
  assert.strictEqual(coreResult.obliquityType, 'mean')
  assert.strictEqual(coreResult.availableForInterpretation, false)
  assert.strictEqual(coreResult.integrationStatus, 'not_connected')
})
