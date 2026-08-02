import assert from 'node:assert/strict'
import test from 'node:test'
import { composeAstrologyRawChart } from '../src/astrology/astrologyEphemerisCore.js'
import { transformDe405State } from '../src/astrology/astrologyEphemerisCore.js'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { DE405_SUN_ORACLE_FIXTURE, EPHEMERIS_TRANSFORM_ORACLE_FIXTURES } from './fixtures/astrologyEphemerisExternalFixtures.js'

const input = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
  location: { longitudeDegreesEast: 0, geographicLatitudeDegrees: 0 },
  timeScaleOffsets: { ut1MinusUtcSeconds: 0, ttMinusUtcSeconds: 64.184 },
}

const states = {
  sun: [26499034.228862327, -132757417.66468561, -57556717.447906621, 29.794260048366745, 5.0180524604150447, 2.1753937286070539],
  moon: [-291608.38845719636, -266716.82923742401, -76102.481323201602, 0.64353137360795276, -0.66608769556622882, -0.30132570660791735],
  mercury: [7037308.2273326442, -192685385.37146372, -87549490.62613073, 66.789251875992676, -3.5116220173352026, -6.2177281504467583],
  venus: [-80957459.750468552, -139679947.02322307, -53870529.763778307, 31.176166165923217, -26.999766058024974, -12.316441545478822],
  mars: [234547174.8710613, -132547797.78294821, -63085879.853218898, 30.956932404097845, 28.936462240325291, 13.114565455478556],
  jupiter: [625066575.90991938, 276628963.09388649, 103337644.26806565, 21.88442157287469, 15.20154985663871, 6.7331128880076392],
  saturn: [984884529.30706263, 790958177.23932946, 282744412.80149341, 22.362240944174239, 11.127228941301672, 5.0183275740852178],
  uranus: [2185474500.2322903, -2003667247.0122633, -907524283.17853439, 34.43128294353982, 9.2809085487694993, 3.9768187672752537],
  neptune: [2541546811.2383709, -3570532894.728282, -1527269748.4549239, 34.260164411729697, 7.9068552592860817, 3.2468453554100698],
  pluto: [-1450831320.6350405, -4318334120.1246614, -918295791.1963979, 35.038412199016264, 3.0656883211669332, -0.015120587483222536],
}

function evaluator() {
  return { availability: 'available', states: Object.fromEntries(Object.entries(states).map(([id, stateKmKmPerSec]) => [id, { stateKmKmPerSec, selectionEvidenceStatus: 'verified' }])) }
}

test('ephemeris core composes ten DE405 bodies deterministically and preserves fail-closed status', () => {
  const args = { timeAngleInput: input, tdbMinusTtSeconds: 0, evaluateStates: evaluator }
  const first = composeAstrologyRawChart(args)
  const second = composeAstrologyRawChart(args)
  assert.deepEqual(first, second)
  assert.equal(first.availability, 'available')
  assert.deepEqual(first.bodies.map((body) => body.id), ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
  assert.ok(first.bodies.every((body) => body.longitudeDegrees >= 0 && body.longitudeDegrees < 360 && Number.isFinite(body.longitudeSpeedDegreesPerDay)))
  assert.equal(first.availableForInterpretation, false)
  assert.equal(first.integrationStatus, 'not_connected')
  assert.equal(composeAstrologyRawChart({ timeAngleInput: input, tdbMinusTtSeconds: 0, evaluateStates: () => ({ availability: 'blocked', reason: 'ephemeris_time_out_of_coverage' }) }).availability, 'blocked')
})

test('generated raw chart is consumed by Rule Core without simulation or order dependence', () => {
  const raw = composeAstrologyRawChart({ timeAngleInput: input, tdbMinusTtSeconds: 0, evaluateStates: evaluator })
  const ruleInput = { ...raw, bodies: [...raw.bodies].reverse() }
  const first = deriveAstrologyRuleChart(raw)
  const second = deriveAstrologyRuleChart(ruleInput)
  assert.equal(first.bodies.length, 10)
  assert.deepEqual(first.bodies.map((body) => body.id).sort(), second.bodies.map((body) => body.id).sort())
  assert.equal(first.metadata.coordinateBasis, 'ecliptic-of-date')
  assert.equal(first.angles.ascendant.availability, 'available')
})

test('IAU SOFA/ERFA precession and mean-ecliptic transform candidate stays within recorded bounds', () => {
  const state = [1, 2, 3, 0.1, 0.2, 0.3]
  const tolerance = 3e-6
  for (const fixture of EPHEMERIS_TRANSFORM_ORACLE_FIXTURES) {
    const actual = transformDe405State(state, fixture.jdTt)
    assert.ok(Math.abs(actual.longitude - fixture.expectedLongitude) <= tolerance, `[${fixture.fixtureId}] longitude`)
    assert.ok(Math.abs(actual.speed - fixture.expectedSpeed) <= 1e-10, `[${fixture.fixtureId}] speed`)
  }
  const actualSun = transformDe405State(DE405_SUN_ORACLE_FIXTURE.state, DE405_SUN_ORACLE_FIXTURE.jdTt)
  assert.ok(Math.abs(actualSun.longitude - DE405_SUN_ORACLE_FIXTURE.expectedLongitude) <= DE405_SUN_ORACLE_FIXTURE.toleranceDegrees)
  assert.ok(Math.abs(actualSun.speed - DE405_SUN_ORACLE_FIXTURE.expectedSpeed) <= DE405_SUN_ORACLE_FIXTURE.toleranceSpeed)
})
